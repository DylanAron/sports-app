import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { colors, fonts } from '../theme';
import { userApi, getToken, setToken, aiApi } from '../services';
import type { UserInfo } from '../services/userService';
import LoginScreen from './profile/LoginScreen';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const [showLogin, setShowLogin] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editBio, setEditBio] = useState('');
  const [essay, setEssay] = useState('');
  const [showEssay, setShowEssay] = useState(false);
  const [showWebView, setShowWebView] = useState<'help' | 'about' | null>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showUserAgreement, setShowUserAgreement] = useState(false);
  const PRIVACY_URL = 'https://6hlot.com/privacy/';

  // 用户服务协议 HTML
  const getUserAgreementHtml = (): string => {
    const content = `
      <h3>1、导言</h3>
      <p>• 欢迎你使用"火箭体育"软件及相关服务！</p>
      <p>• "火箭体育"软件及相关服务，系指公司通过合法拥有并运营的、标注名称为"火箭体育"的客户端应用程序，向你提供的产品与服务，包括但不限于个性化推荐、信息浏览、发布信息、互动交流、搜索查询等核心功能以及其他功能。《火箭体育用户协议》（以下简称"本协议"）是你与公司之间就你注册、登录、使用（以下统称"使用"）"火箭体育"软件及相关服务所订立的协议。</p>
      <p>• 为了更好地为你提供服务，请你在开始使用"火箭体育"软件及相关服务之前，认真阅读并充分理解本协议，特别是涉及免除或者限制责任的条款、权利许可和信息使用的条款、同意开通和使用特殊单项服务的条款、法律适用和争议解决条款等。其中，免除或者限制责任条款等重要内容将以加粗形式提示你注意，你应重点阅读。 如你未满18周岁，请在法定监护人陪同下仔细阅读并充分理解本协议，并征得法定监护人的同意后使用"火箭体育"软件及相关服务。</p>
      <p>• 如你不同意本协议，这将导致我们无法为你提供完整的产品和服务，你也可以选择停止使用。如你自主选择同意或使用"火箭体育"软件及相关服务，则视为你已充分理解本协议，并同意作为本协议的一方当事人接受本协议以及其他与"火箭体育"软件及相关服务相关的协议和规则（包括但不限于《隐私政策》）的约束。</p>

      <h3>2、"火箭体育"软件及相关服务</h3>
      <p>• 2.1 你使用"火箭体育"软件及相关服务，可以通过预装、公司已授权的第三方下载等方式获取"火箭体育"客户端应用程序。若你并非从公司或经公司授权的第三方获取本软件的，公司无法保证非官方版本的"火箭体育"软件能够正常使用，你因此遭受的损失与公司无关。</p>
      <p>• 2.2 公司可能为不同的终端设备开发不同的应用程序软件版本，你应当根据实际设备状况获取、下载、安装合适的版本。如你不再使用"火箭体育"软件及相关服务，你也可自行卸载相应的应用程序软件。</p>
      <p>• 2.3 为更好的提升用户体验及服务，公司将不定期提供"火箭体育"软件及相关服务的更新或改变（包括但不限于软件修改、升级、功能强化、开发新服务、软件替换等），你可根据需要自行选择是否更新相应的版本。为保证"火箭体育"软件及相关服务安全、提升用户服务，在"火箭体育"软件及相关服务的部分或全部更新后，公司将在可行的情况下以妥当的方式（包括但不限于系统提示、公告、站内信等）提示你，你有权选择接受更新后的版本；如你选择不作更新，"火箭体育"软件及相关服务的部分功能将受到限制或不能正常使用。</p>
      <p>• 2.4 除非得到公司事先书面授权，你不得以任何形式对"火箭体育"软件及相关服务进行包括但不限于改编、复制、传播、垂直搜索、镜像或交易等未经授权的访问或使用。</p>
      <p>• 2.5 你理解，使用"火箭体育"软件及相关服务需自行准备与软件及相关服务有关的终端设备（如电脑、手机等），一旦你在终端设备中打开"火箭体育"软件或访问"火箭体育"的网站，即视为你使用"火箭体育"软件及相关服务。为充分实现"火箭体育"的全部功能，你可能需要将终端设备联网，你理解由你承担所需要的费用（如流量费、上网费等）。</p>
      <p>• 2.6 你清楚并理解，火箭体育部分服务为收费的增值服务，在你使用增值服务时，需要消耗一定数量的增值服务代用币。增值服务代用币通过使用人民币兑换获得，人民币一经兑换成增值服务代用币，则视为人民币已经使用，增值服务代用币不可兑换成人民币；增值服务代用币用于购买相关虚拟道具使用权或者接受相关增值服务。</p>
      <p>• 2.7 公司许可你一项个人的、不可转让的、非独占地和非商业的合法使用"火箭体育"软件及相关服务的权利。本协议未明示授权的其他一切权利仍由公司保留，你在行使该些权利前须另行获得公司的书面许可，同时公司如未行使前述任何权利，并不构成对该权利的放弃。</p>
      <p>• 2.8 你无需注册也可开始使用"火箭体育"软件及相关服务，但部分功能或服务可能会受到影响。同时，你也理解，为使你更好地使用"火箭体育"软件及相关服务，保障你的账号安全，某些功能和/或某些单项服务项目（如回帖回帖评论服务等）将要求你按照国家相关法律法规的规定，提供真实的身份信息实名注册并登录后方可使用。</p>

      <h3>3、关于"账号"</h3>
      <p>• 3.1 "火箭体育"软件及相关服务为你提供了注册通道，你有权选择合法的字符组合作为自己的账号，并自行设置符合安全要求的密码。用户设置的账号、密码是用户用以登录并使用"火箭体育"软件及相关服务的凭证。</p>
      <p>• 3.2 你理解并承诺，你所设置的账号不得违反国家法律法规及公司的相关规则，不得实施任何侵害国家利益、损害其他公民合法权益，有害社会道德风尚的行为，你的账号名称、头像和简介等注册信息及其他个人信息中不得出现违法和不良信息，未经他人许可不得用他人名义（包括但不限于冒用他人姓名、名称、字号、头像等足以让人引起混淆的方式）开设账号，不得恶意注册"火箭体育"账号（包括但不限于频繁注册、批量注册账号等行为）。公司有权对你提交的信息进行审核。</p>
      <p>• 3.3 你的账号仅限于你本人使用，未经公司书面同意，禁止以任何形式赠与、借用、出租、转让、售卖或以其他方式许可他人使用该账号。如果公司发现或者有合理理由认为使用者并非账号初始注册人，为保障账号安全，公司有权立即暂停或终止向该注册账号提供服务，或注销该账号。</p>
      <p>• 3.4 你有责任维护个人账号、密码的安全性与保密性，并对你以注册账号名义所从事的活动承担全部法律责任，包括但不限于你在"火箭体育"软件及相关服务上进行的任何数据修改、言论发表、款项支付等操作行为可能引起的一切法律责任。你应高度重视对账号与密码的保密，在任何情况下不向他人透露账号及密码。若发现他人未经许可使用你的账号或发生其他任何安全漏洞问题时，你应当立即通知公司。</p>
      <p>• 3.5 在丢失账号或遗忘密码时，你可遵照公司的申诉途径及时申诉请求找回账号或密码。你理解并认可，公司的密码找回机制仅需要识别申诉单上所填资料与系统记录资料具有一致性，而无法识别申诉人是否系真正账号有权使用者。公司特别提醒你应妥善保管你的账号和密码。当你使用完毕后，应安全退出。如因你保管不当等自身原因或其他不可抗因素导致遭受盗号或密码丢失，你将自行承担相应责任。</p>
      <p>• 3.6 在注册、使用和管理账号时，你应保证注册账号时填写的身份信息的真实性，请你在注册、管理账号时使用真实、准确、合法、有效的相关身份证明材料及必要信息（包括你的姓名及电子邮件地址、联系电话、联系地址等）。依照国家相关法律法规的规定，为使用"火箭体育"软件及相关服务的部分功能，你需要填写真实的身份信息，请你按照相关法律规定完成实名认证，并注意及时更新上述相关信息。若你提交的材料或提供的信息不规范或不符合要求的，则公司有权拒绝为你提供相关功能，你可能无法使用"火箭体育"软件及相关服务或在使用过程中部分功能受到限制。</p>
      <p>• 3.7 除自行注册"火箭体育"账号外，用户也可授权使用其合法拥有的包括但不限于公司和/或其关联公司其他软件用户账号，以及实名注册的第三方软件用户账号登录使用"火箭体育"软件及相关服务，但第三方软件或平台对此有限制或禁止的除外。当用户以前述已有账号登录使用的，应保证相应账号已进行实名注册登记，并同样适用本协议中的相关条款。</p>
      <p>• 3.8 你理解并同意，除你登录、使用"火箭体育"软件及相关服务外，你还可以用"火箭体育"账号登录使用公司及其关联公司提供的其他软件、服务。你以"火箭体育"账号登录并使用前述服务时，将受到前述服务的实际提供方的《用户协议》及其他协议条款约束。</p>
      <p>• 3.9 为提高你内容曝光量及发布效率，你同意你在本软件/网站的账号及相应账号所发布的全部内容均授权本公司以你的账号自动同步发布至公司及/或关联公司运营的其他软件及网站。你在本软件/网站发布、修改、删除内容的操作，均会同步到上述系列其他软件及网站。 你通过已注册账号或者第三方软件用户账号注册或登录公司及/或关联公司运营的其他软件产品及网站时（如有），应遵守该软件及网站自身的《用户协议》及其他协议条款约束。</p>
      <p>• 3.10 当你完成"火箭体育"的账号注册、登录并进行合理和必要的身份验证后，你可随时浏览、修改自己提交的个人身份信息。你理解并同意，出于安全性和身份识别（如账号或密码找回申诉服务等）的考虑，你可能无法修改注册时提供的初始注册信息及其他验证信息。你也可以申请注销账号，公司会在完成个人身份、安全状态、设备信息等合理和必要的验证后协助你注销账号，并依照你的要求删除有关你账号的一切信息，法律法规另有规定的除外。</p>
      <p>• 3.11 当您进入"火箭体育"推广的游戏时，要求您按照国家相关法律法规的规定，提供真实的身份信息实名注册并登录后方可使用，若您为未成年人的，火箭体育将依法根据国家相关法律法规及监管要求限制您的使用时间及使用行为。</p>
      <p>• 3.12 你理解并同意，为了充分使用账号资源，如你在注册后未及时进行初次登录使用或连续超过60日未登录账号使用等情形，则自第60日当天的24时起，公司有权采取措施删除该用户帐号以及该用户帐号相关任何记录及虚拟物品（包括但不限于等级、使用记录、增值服务代用币等数据信息），删除后的数据信息无法再恢复。</p>

      <h3>4、用户个人信息保护</h3>
      <p>公司与你一同致力于你个人信息（即能够独立或与其他信息结合后识别用户身份的信息）的保护，保护用户个人信息是公司的基本原则之一。在使用"火箭体育"软件及相关服务的过程中，你可能需要提供你的个人信息（包括但不限于姓名、电话号码、位置信息等），以便公司向你提供更好的服务和相应的技术支持。公司将运用加密技术、匿名化处理等其他与"火箭体育"软件及相关服务相匹配的技术措施及其他安全措施保护你的个人信息，更多关于用户个人信息保护的内容，请参见《隐私政策》。</p>

      <h3>5、用户行为规范</h3>
      <p>• 5.1 用户行为要求</p>
      <p>• 你应当对你使用本软件及相关服务的行为负责，除非法律允许或者经公司事先书面许可，你使用"火箭体育"软件及相关服务不得具有下列行为：</p>
      <p>• 5.1.1 使用未经公司授权或许可的任何插件、外挂、系统或第三方工具对"火箭体育"软件及相关服务的正常运行进行干扰、破坏、修改或施加其他影响。</p>
      <p>• 5.1.2 利用或针对"火箭体育"软件及相关服务进行任何危害计算机网络安全的行为，包括但不限于：</p>
      <p>（1）非法侵入他人网络、干扰他人网络正常功能、窃取网络数据等危害网络安全的活动；</p>
      <p>（2）提供专门用于从事侵入网络、干扰网络正常功能及防护措施、窃取网络数据等危害网络安全活动的程序、工具；</p>
      <p>（3）明知他人从事危害网络安全的活动的，为其提供技术支持、广告推广、支付结算等帮助；</p>
      <p>（4）使用未经许可的数据或进入未经许可的服务器/账号；</p>
      <p>（5）未经允许进入公众计算机网络或者他人计算机系统并删除、修改、增加存储信息；</p>
      <p>（6）未经许可，企图探查、扫描、测试"火箭体育"系统或网络的弱点或其它实施破坏网络安全的行为；</p>
      <p>（7）企图干涉、破坏"火箭体育"系统或网站的正常运行，故意传播恶意程序或病毒以及其他破坏干扰正常网络信息服务的行为；</p>
      <p>（8）伪造TCP/IP数据包名称或部分名称；</p>
      <p>（9）对"火箭体育"软件及相关服务进行反向工程、反向汇编、编译或者以其他方式尝试发现本软件的源代码；</p>
      <p>（10）恶意注册"火箭体育"软件及相关服务的账号，包括但不限于频繁、批量注册账号；</p>
      <p>（11）违反法律法规、本协议、公司的相关规则及侵犯他人合法权益的其他行为。</p>
      <p>• 5.1.3 如果公司有理由认为你的行为违反或可能违反上述约定的，公司可独立进行判断并处理，且有权在不事先通知的情况下终止向你提供服务，并追究相关法律责任。</p>
      <p>• 5.2 信息内容规范</p>
      <p>• 5.2.1 你按规定完成实名认证后，可以以注册账号或"火箭体育"合作平台账号登录"火箭体育"发布内容、回帖评论等，为维护良好社区氛围，请您遵循《火箭体育发言公约》进行发布内容、回帖评论。</p>
      <p>• 5.2.2 公司致力使发布信息、回帖评论成为文明、理性、友善、高质量的意见交流。在推动发布信息、互动交流、回帖评论业务发展的同时，不断加强相应的信息安全管理能力，完善发布信息、回帖评论自律，切实履行社会责任，遵守国家法律法规，尊重公民合法权益，尊重社会公序良俗。</p>
      <p>• 5.2.3 你评论、发布、传播的内容应自觉遵守宪法法律、法规、遵守公共秩序，尊重社会公德、社会主义制度、国家利益、公民合法权益、道德风尚和信息真实性等要求。你同意并承诺不制作、复制、发布、传播法律、法规禁止的下列信息内容：</p>
      <p>（1）反对宪法确定的基本原则的；</p>
      <p>（2）危害国家安全，泄露国家秘密的；</p>
      <p>（3）颠覆国家政权，推翻社会主义制度、煽动分裂国家、破坏国家统一的；</p>
      <p>（4）损害国家荣誉和利益的；</p>
      <p>（5）宣扬恐怖主义、极端主义的；</p>
      <p>（6）宣扬民族仇恨、民族歧视，破坏民族团结的；</p>
      <p>（7）煽动地域歧视、地域仇恨的；</p>
      <p>（8）破坏国家宗教政策，宣扬邪教和迷信的；</p>
      <p>（9）编造、散布谣言、虚假信息，扰乱经济秩序和社会秩序、破坏社会稳定的；</p>
      <p>（10）散布、传播暴力、淫秽、色情、赌博、凶杀、恐怖或者教唆犯罪的；</p>
      <p>（11）侵害未成年人合法权益或者损害未成年人身心健康的；</p>
      <p>（12）未获他人允许，偷拍、偷录他人，侵害他人合法权利的；</p>
      <p>（13）包含恐怖、暴力血腥、高危险性、危害表演者自身或他人身心健康内容的；</p>
      <p>（14）危害网络安全、利用网络从事危害国家安全、荣誉和利益的；</p>
      <p>（15）侮辱或者诽谤他人，侵害他人合法权益的；</p>
      <p>（16）对他人进行暴力恐吓、威胁，实施人肉搜索的；</p>
      <p>（17）涉及他人隐私、个人信息或资料的；</p>
      <p>（18）散布污言秽语，损害社会公序良俗的；</p>
      <p>（19）侵犯他人隐私权、名誉权、肖像权、知识产权等合法权益内容的；</p>
      <p>（20）散布商业广告，或类似的商业招揽信息、过度营销信息及垃圾信息；</p>
      <p>（21）使用本网站常用语言文字以外的其他语言文字评论的；</p>
      <p>（22）与所评论的信息毫无关系的；</p>
      <p>（23）所发表的信息毫无意义的，或刻意使用字符组合以逃避技术审核的；</p>
      <p>（24）其他违反法律法规、政策及公序良俗、干扰"火箭体育"正常运营或侵犯其他用户或第三方合法权益内容的其他信息。</p>
      <p>• 5.3 公司设立公众投诉、举报平台，你可按照公司公示的投诉举报制度向公司投诉、举报各类违法违规行为、违法传播活动、违法有害信息、网络"黑公关"行为等内容，公司将及时受理和处理你的投诉举报，以共同营造风清气正的网络空间。</p>
      <p>• 5.4用户存在以下行为，一经发现立即封禁账号</p>
      <p>• 5.4.1发布或诱导色情低俗的内容</p>
      <p>（1）对性部位和性行为进行展示、过度描述或内涵表述的；</p>
      <p>（2）有明显的性挑逗、性骚扰、性侮辱或类似效果的画面、台词、音乐及音效等；</p>
      <p>（3）传播色情网站、色情交易或联系方式的。</p>
      <p>• 5.4.2发布或传播虚假信息并造成恶劣影响的：</p>
      <p>（1）杜撰、编造或曲解事实，制造与事实相悖或违背科学常理的谣言；</p>
      <p>（2）伪造或恶意传播虚假系统信息，包括但不限于系统通知、系统数据；</p>
      <p>（3）杜撰、编造社会负面/敏感事件进行商品分享。</p>
      <p>• 5.4.3仿冒机构、个人，包括但不限于名人明星、党政机关、新闻机构、公职人员等，诱骗他人或造成恶劣影响的；</p>
      <p>• 5.4.4以营利、获益的目的，为他人删除、下沉、稀释网络信息和发布网络信息等网络"黑公关"行为。</p>

      <h3>6、"火箭体育"信息内容的使用规范</h3>
      <p>• 6.1 未经公司书面许可，你不得自行或授权、允许、协助任何第三人对本协议"火箭体育"软件及相关服务中信息内容进行如下行为：</p>
      <p>（1）复制、读取、采用"火箭体育"软件及相关服务的信息内容，用于包括但不限于宣传、增加阅读量、浏览量等商业用途；</p>
      <p>（2）擅自编辑、整理、编排"火箭体育"软件及相关服务的信息内容后在"火箭体育"软件及相关服务的源页面以外的渠道进行展示；</p>
      <p>（3）采用包括但不限于特殊标识、特殊代码等任何形式的识别方法，自行或协助第三人对"火箭体育"软件及相关服务的信息内容产生流量、阅读量引导、转移、劫持等不利影响；</p>
      <p>（4）其他非法获取或使用"火箭体育"软件及相关服务的信息内容的行为。</p>
      <p>• 6.2 经公司书面许可后，你对"火箭体育"软件及相关服务的信息内容的分享、转发等行为，还应符合以下规范：</p>
      <p>（1）对抓取、统计、获得的相关搜索热词、命中率、分类、搜索量、点击率、阅读量等相关数据，未经公司事先书面同意，不得将上述数据以任何方式公示、提供、泄露给任何第三人；</p>
      <p>（2）不得对"火箭体育"软件及相关服务的源网页进行任何形式的任何改动，包括但不限于"火箭体育"软件及相关服务的首页（profile页面）链接，广告系统链接等入口，也不得对"火箭体育"软件及相关服务的源页面的展示进行任何形式的遮挡、插入、弹窗等妨碍；</p>
      <p>（3）应当采取安全、有效、严密的措施，防止"火箭体育"软件及相关服务的信息内容被第三方通过包括但不限于"蜘蛛（spider）"程序等任何形式进行非法获取；</p>
      <p>（4）不得把相关数据内容用于公司书面许可范围之外的目的，进行任何形式的销售和商业使用，或向第三方泄露、提供或允许第三方为任何方式的使用；</p>
      <p>（5）向任何第三人分享、转发、复制"火箭体育"软件及相关服务信息内容的行为，应当遵守公司为此制定的其他规范和标准。</p>

      <h3>7、违约处理</h3>
      <p>• 7.1 针对你违反本协议或其他服务条款的行为，公司有权独立判断并视情况采取预先警示、拒绝发布、立即停止传输信息、删除回帖、短期禁止发言、限制账号部分或者全部功能直至永久关闭账号等措施。公司有权公告处理结果，且有权根据实际情况决定是否恢复相关账号的使用。对涉嫌违反法律法规、涉嫌违法犯罪的行为将保存有关记录，并依法向有关主管部门报告、配合有关主管部门调查。</p>
      <p>• 7.2 因你违反本协议或其他服务条款规定，引起第三方投诉或诉讼索赔的，你应当自行处理并承担全部可能由此引起的法律责任。因你的违法、侵权或违约等行为导致公司及其关联公司向任何第三方赔偿或遭受国家机关处罚的，你还应足额赔偿公司及其关联公司因此遭受的全部损失。</p>
      <p>• 7.3 公司尊重并保护用户及他人的知识产权、名誉权、姓名权、隐私权等合法权益。你保证，在使用"火箭体育"软件及相关服务时上传的文字、图片、视频、音频、链接等不侵犯任何第三方的知识产权、名誉权、姓名权、隐私权等权利及合法权益。否则，公司有权在收到权利方或者相关方通知的情况下移除该涉嫌侵权内容。针对第三方提出的全部权利主张，你应自行处理并承担全部可能由此引起的法律责任；如因你的侵权行为导致公司及其关联公司遭受损失的（包括经济、商誉等损失），你还应足额赔偿公司及其关联公司遭受的全部损失。</p>

      <h3>8、服务的变更、中断和终止</h3>
      <p>• 8.1 你理解并同意，公司提供的"火箭体育"软件及相关服务是按照现有技术和条件所能达到的现状提供的。公司会尽最大努力向你提供服务，确保服务的连贯性和安全性。你理解，公司不能随时预见和防范技术以及其他风险，包括但不限于不可抗力、网络原因、第三方服务瑕疵、第三方网站等原因可能导致的服务中断、不能正常使用本软件及服务以及其他的损失和风险。</p>
      <p>• 8.2 你理解并同意，公司为了服务整体运营、平台运营安全的需要，有权视具体情况有权决定服务/功能设置、范围，修改、中断、中止或终止"火箭体育"软件及相关服务。</p>

      <h3>9、未成年人使用条款</h3>
      <p>• 9.1 若用户是未满18周岁的未成年人，应在监护人监护、指导并获得监护人同意情况下认真阅读本协议后，方可使用"火箭体育"软件及相关服务。</p>
      <p>• 9.2 公司重视对未成年人个人信息的保护，未成年用户在填写个人信息时，请加强个人保护意识并谨慎对待，并在监护人指导时正确使用"火箭体育"软件及相关服务。</p>
      <p>• 9.3 未成年用户理解如因你违反法律法规、本协议内容，则你及你的监护人应依照法律规定承担因此而可能引起的全部法律责任。</p>
      <p>• 9.4 未成年人用户特别提示：</p>
      <p>• 9.4.1 青少年使用本软件及相关服务应该在其监护人的监督指导下，在合理范围内正确学习使用网络，避免沉迷虚拟的网络空间，养成良好上网习惯。</p>
      <p>• 9.4.2 青少年用户必须遵守《全国青少年网络文明公约》：</p>
      <p>（1）要善于网上学习，不浏览不良信息；</p>
      <p>（2）要诚实友好交流，不侮辱欺诈他人；</p>
      <p>（3）要增强自护意识，不随意约会网友；</p>
      <p>（4）要维护网络安全，不破坏网络秩序；</p>
      <p>（5）要有益身心健康，不沉溺虚拟时空。</p>
      <p>• 9.5 为更好的保护未成年人隐私权益，公司提醒用户慎重发布包含未成年人素材的内容，一经发布，即视为用户同意本软件及相关服务展示未成年人的信息、肖像、声音等，且允许公司依据本协议使用、处理该等与未成年人相关的内容。</p>

      <h3>10、知识产权</h3>
      <p>• 10.1 公司在"火箭体育"软件及相关服务中提供的内容（包括但不限于软件、技术、程序、网页、文字、图片、图像、音频、视频、图表、版面设计、电子文档等）的知识产权属于公司所有。公司提供本服务时所依托的软件的著作权、专利权及其他知识产权均归公司所有。未经公司许可，任何人不得擅自使用（包括但不限于通过任何机器人、蜘蛛等程序或设备监视、复制、传播、展示、镜像、上载、下载）"火箭体育"软件及相关服务中的内容。</p>
      <p>• 10.2 你理解并同意，在使用"火箭体育"软件及相关服务时发布上传的文字、图片、视频、音频等均由你原创或已获合法授权。你通过"火箭体育"上传、发布的任何内容的知识产权归属你或原始著作权人所有。</p>
      <p>• 10.3 你知悉、理解并同意，为持续改善并为您提供更好的服务，你通过"火箭体育"软件及相关服务上传发布、传输或传播的内容（包括但不限于文字、图片、图像、音频、视频和/或音频中的音乐、声音、对话等），授权公司及其关联公司、控制公司、继承公司一项全球范围内、免费、非独家、可再许可（通过多层次）的权利（包括但不限于复制权、信息网络传播权、改编权、汇编权、修改权、翻译权、制作衍生品、表演和展示等权利），使用范围包括但不限于在当前或其他网站、应用程序、产品或终端设备等。您在此确认并同意，上述权利的授予包括在内容、"火箭体育"、公司和/或公司品牌有关的任何的宣传、推广、广告和/或相关营销中使用和以其他方式开发内容（全部或部分）的权利和许可。为避免疑惑，您同意，上述权利的授权包括许可使用、复制、展示、传播您拥有或被许可使用并植入内容中的个人形象、肖像、姓名、商标、服务标志、品牌、名称、标识、公司标记及其他物料、素材等。</p>
      <p>• 10.4 你确认并同意授权公司以公司自己的名义或委托专业第三方对侵犯你上传发布的享有知识产权的内容进行代维权，维权形式包括但不限于：监测侵权行为、发送维权函、提起诉讼或仲裁、调解、和解等，公司有权对维权事宜做出决策并独立实施。</p>
      <p>• 10.5 公司为"火箭体育"开发、运营提供技术支持，并对"火箭体育"软件及相关服务的开发和运营等过程中产生的所有数据和信息等享有法律法规允许范围内的全部权利。</p>
      <p>• 10.6 请你在任何情况下都不要私自使用公司的包括但不限于"火箭体育"在内的任何商标、服务标记、商号、域名、网站名称或其他显著品牌特征等（以下统称为"标识"）。未经公司事先书面同意，你不得将本条款前述标识以单独或结合任何方式展示、使用或申请注册商标、进行域名注册等，也不得实施向他人明示或暗示有权展示、使用、或其他有权处理该些标识的行为。由于你违反本协议使用公司上述商标、标识等给公司或他人造成损失的，由你承担全部法律责任。</p>

      <h3>11、免责声明</h3>
      <p>• 11.1 你理解并同意，"火箭体育"软件及相关服务可能会受多种因素的影响或干扰，公司不保证(包括但不限于)：</p>
      <p>• 11.1.1 "火箭体育"软件及相关服务完全适合用户的所有使用要求；</p>
      <p>• 11.1.2 "火箭体育"软件及相关服务不受干扰，及时、安全、可靠或不出现任何错误；你经由公司取得的任何软件、服务或其他材料符合用户的期望；</p>
      <p>• 11.1.3 "火箭体育"软件及相关服务中任何错误都将能得到更正。</p>
      <p>• 11.2 如有涉嫌借款或其他涉财产的网络信息、账户密码、广告或推广等信息，请你谨慎对待并自行进行判断，你因此遭受的利润、商业信誉、资料损失或其他有形或无形损失，公司不承担任何直接、间接、附带、特别、衍生性或惩罚性的赔偿责任。</p>
      <p>• 11.3 你理解并同意，在使用"火箭体育"软件及相关服务过程中，可能遇到不可抗力等因素（不可抗力是指不能预见、不能克服并不能避免的客观事件），包括但不限于自然灾害(如洪水、地震、台风等)、政府行为、战争、罢工、骚动、暴乱等。出现不可抗力情况时，公司将努力在第一时间及时修复，但因不可抗力造成的损失，公司在法律法规范围内免于承担责任。</p>
      <p>• 11.4 公司依据本协议约定获得处理违法违规内容的权利，该权利不构成公司的义务或承诺，公司不能保证及时发现违法行为或进行相应处理。</p>
      <p>• 11.5 你理解并同意，关于"火箭体育"软件及相关服务，公司不提供任何种类的明示或暗示担保或条件，包括但不限于商业适售性、特定用途适用性等。你对"火箭体育"软件及相关服务的使用行为需自行承担相应风险。</p>
      <p>• 11.6 你理解并同意，本协议是在保障遵守国家法律法规、维护公序良俗，保护他人合法权益，公司在能力范围内尽最大的努力按照相关法律法规进行判断，但并不保证公司判断完全与司法机关、行政机关的判断一致，如因此产生的后果你已经理解并同意自行承担。</p>
      <p>• 11.7 在任何情况下，公司均不对任何间接性、后果性、惩罚性、偶然性、特殊性或刑罚性的损害，包括因你使用"火箭体育"软件及相关服务而遭受的利润损失，承担责任。公司对你承担的全部责任，无论因何原因或何种行为方式，始终不超过你在成员期内因使用"火箭体育"软件及相关服务而支付给公司的费用(如有)。</p>

      <h3>12、关于单项服务与第三方服务的特殊约定</h3>
      <p>• 12.1 "火箭体育"软件及相关服务中包含公司以各种合法方式获取的信息或信息内容链接，同时也包括公司和/或其关联方合法运营的其他单项服务。你可以在"火箭体育"软件中开启和使用上述单项服务。某些单项服务可能需要你同时接受就此特别制订的协议或者其他约束你与该单项服务提供者之间的规则，必要时在你计划使用前述单向服务时以醒目的方式向你提供这些协议、规则，供你查阅与同意。一旦你开始使用上述服务，则视为你理解并接受有关单项服务的相关协议、规则的约束。如未标明使用期限、或未标明使用期限为"永久"、"无限期"或"无限制"的，则这些产品或服务的使用期限为自用户开始使用该产品或服务至该产品或服务在"火箭体育"软件中下线之日为止。</p>
      <p>• 12.2如你在"火箭体育"软件中使用第三方提供的软件或相关服务时，除遵守本协议及火箭体育相关规则外，还可能需要同意并遵守第三方的协议、隐私政策及相关规则。如因第三方软件及相关服务产生的争议、损失或损害，由你与第三方自行解决，公司并不就此而对你或任何第三方承担任何责任。</p>

      <h3>13、其他</h3>
      <p>• 13.1 本协议的成立、生效、履行、解释及争议的解决均应适用中华人民共和国法律。若本协议之任何规定因与中华人民共和国的法律抵触而无效或不可执行，则这些条款将尽可能按照接近本协议原条文意旨重新解析，且本协议其它规定仍应具有完整的效力及效果。</p>
      <p>• 13.2 本协议的签订地为中华人民共和国厦门市。若你因本协议与公司发生任何争议，双方应尽量友好协商解决；如协商不成的，你同意应将相关争议提交至本协议签订地的人民法院诉讼解决。</p>
      <p>• 13.3 为给你提供更好的服务或国家法律法规、政策调整，"火箭体育"及相关服务将不时更新与变化，我们会适时对本协议进行修订，这些修订构成本协议的一部分。本协议更新后，我们会在"火箭体育"发出更新版本，并在更新后的条款生效前通过"火箭体育"软件中发布公告或其他适当的方式提醒你更新的内容，以便你及时了解本协议的最新版本，你也可以在网站首页或软件设置页面查阅最新版本的协议条款。如你继续使用"火箭体育"软件及相关服务，表示同意接受修订后的本协议的内容。如您对修改后的协议条款存有异议的，请立即停止登录或使用"火箭体育"软件及相关服务。若您继续登录或使用"火箭体育"软件及相关服务，即视为您认可并接受修改后的协议条款。</p>
      <p>• 13.4 本协议中的标题仅为方便及阅读而设，并不影响本协议中任何规定的含义或解释。</p>
      <p>• 13.5 你和公司均是独立的主体，在任何情况下本协议不构成公司对用户的任何形式的明示或暗示担保或条件，双方之间亦不构成代理、合伙、合营或雇佣关系。</p>
      <p>• 13.6 如果您对本用户协议有投诉、疑问或建议，可以通过邮箱：420361196@qq.com 与我们取得联系。</p>
    `;

    return `
      <html><head>
      <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
      <style>
        body { font-family: -apple-system, sans-serif; padding: 20px; color: #1e293b; background: #fff; font-size: 15px; line-height: 1.8; }
        h2 { color: #2563eb; font-size: 22px; margin-bottom: 16px; }
        h3 { color: #1e293b; font-size: 18px; margin-top: 20px; margin-bottom: 10px; }
        h4 { color: #475569; font-size: 15px; margin-top: 16px; margin-bottom: 6px; }
        p { color: #475569; margin-bottom: 12px; }
        ul { padding-left: 20px; }
        li { margin-bottom: 8px; color: #475569; }
        strong { color: #2563eb; }
      </style>
      </head><body>${content}</body></html>`;
  };

  // 加载用户信息
  const loadUser = async () => {
    if (!getToken()) return;
    try {
      const info = await userApi.getInfo();
      setUser(info);
    } catch { }
  };

  useEffect(() => {
    if (loggedIn) loadUser();
  }, [loggedIn]);

  // 登录成功
  const handleLoginSuccess = () => {
    setLoggedIn(true);
    setShowLogin(false);
  };

  // 退出登录
  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出', style: 'destructive', onPress: () => {
          setToken(undefined);
          setUser(null);
          setLoggedIn(false);
        },
      },
    ]);
  };

  // 编辑个人信息
  const handleEdit = () => {
    setEditNickname(user?.nickname || '');
    setEditBio(user?.bio || '');
    setShowEdit(true);
  };

  const handleSaveProfile = async () => {
    try {
      const updated = await userApi.updateProfile({ nickname: editNickname, bio: editBio });
      setUser(updated);
      setShowEdit(false);
      Alert.alert('成功', '个人信息已更新');
    } catch (e: any) {
      Alert.alert('失败', e.message);
    }
  };

  // 点击个人资料 - 随机生成励志散文
  const handleProfilePress = async () => {
    if (!loggedIn) { setShowLogin(true); return; }
    try {
      const res = await aiApi.getEssay();
      setEssay(res.content);
      setShowEssay(true);
    } catch {
      setEssay('生活如登山，每一步都是向上的力量。坚持梦想，勇往直前。');
      setShowEssay(true);
    }
  };

  // 显示富文本页面
  const showRichContent = async (type: 'help' | 'about') => {
    try {
      const { contentApi } = await import('../services');
      const res = type === 'help' ? await contentApi.getHelp() : await contentApi.getAbout();
      const styledHtml = `
        <html><head>
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
        <style>
          body { font-family: -apple-system, sans-serif; padding: 20px; color: #1e293b; background: #fff; font-size: 15px; line-height: 1.8; }
          h2 { color: #2563eb; font-size: 22px; margin-bottom: 16px; }
          h3 { color: #1e293b; font-size: 18px; margin-top: 20px; margin-bottom: 10px; }
          h4 { color: #475569; font-size: 15px; margin-top: 16px; margin-bottom: 6px; }
          p { color: #475569; margin-bottom: 12px; }
          ul { padding-left: 20px; }
          li { margin-bottom: 8px; color: #475569; }
          strong { color: #2563eb; }
        </style>
        </head><body>${res.content}</body></html>`;
      setHtmlContent(styledHtml);
      setShowWebView(type);
    } catch { }
  };

  const menuItems = loggedIn ? [
    { icon: '👤', label: '个人资料', onPress: handleProfilePress },
    { icon: '🔔', label: '消息通知', onPress: () => setShowEssay(true), badge: '' },
    { icon: '❓', label: '帮助与反馈', onPress: () => showRichContent('help') },
    { icon: 'ℹ️', label: '关于我们', onPress: () => showRichContent('about') },
    { icon: '📞', label: '联系客服', onPress: () => navigation.navigate('CustomerService') },
    { icon: '🔒', label: '隐私协议', onPress: () => setShowPrivacy(true) },
    { icon: '📄', label: '用户协议', onPress: () => setShowUserAgreement(true) },
  ] : [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>我的</Text>
          <Text style={styles.headerSubtitle}>PROFILE</Text>
        </View>

        {loggedIn && user ? (
          <>
            {/* 用户信息卡片 */}
            <TouchableOpacity style={styles.profileCard} onPress={handleProfilePress}>
              <View style={styles.avatar}>
                {user.avatar ? (
                  <Text style={styles.avatarText}>{user.nickname?.charAt(0) || 'U'}</Text>
                ) : (
                  <Text style={styles.avatarText}>{user.nickname?.charAt(0) || 'U'}</Text>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.username}>{user.nickname || '用户'}</Text>
                <Text style={styles.userDesc}>{user.bio || '体育世界 尽在掌握'}</Text>
              </View>
              <TouchableOpacity style={styles.editBadge} onPress={handleEdit}>
                <Text style={styles.editText}>编辑</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            {/* 用户菜单 */}
            <View style={styles.menuCard}>
              {menuItems.map((item, idx) => (
                <TouchableOpacity key={idx} onPress={item.onPress}>
                  <View style={styles.menuItem}>
                    <View style={styles.menuLeft}>
                      <Text style={styles.menuIcon}>{item.icon}</Text>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                    </View>
                    <Text style={styles.menuArrow}>›</Text>
                  </View>
                  {idx < menuItems.length - 1 && <View style={styles.menuDivider} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* 退出登录 */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>退出登录</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* 未登录卡片 */}
            <TouchableOpacity style={styles.profileCard} onPress={() => setShowLogin(true)}>
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={[styles.avatarText, { color: colors.textDim }]}>?</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.username}>点击登录</Text>
                <Text style={styles.userDesc}>登录后享受完整功能</Text>
              </View>
              <Text style={[styles.menuArrow, { fontSize: 24 }]}>›</Text>
            </TouchableOpacity>

            {/* 未登录菜单 */}
            <View style={styles.menuCard}>
              {[
                { icon: '❓', label: '帮助与反馈', onPress: () => showRichContent('help') },
                { icon: 'ℹ️', label: '关于我们', onPress: () => showRichContent('about') },
                { icon: '📞', label: '联系客服', onPress: () => navigation.navigate('CustomerService') },
                { icon: '🔒', label: '隐私协议', onPress: () => setShowPrivacy(true) },
                { icon: '📄', label: '用户协议', onPress: () => setShowUserAgreement(true) },
              ].map((item, idx) => (
                <TouchableOpacity key={idx} onPress={item.onPress}>
                  <View style={styles.menuItem}>
                    <View style={styles.menuLeft}>
                      <Text style={styles.menuIcon}>{item.icon}</Text>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                    </View>
                    <Text style={styles.menuArrow}>›</Text>
                  </View>
                  {idx < 4 && <View style={styles.menuDivider} />}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.version}>Sports World v1.0.0</Text>
      </ScrollView>

      {/* 登录弹窗 */}
      <Modal visible={showLogin} animationType="slide">
        <LoginScreen onLoginSuccess={handleLoginSuccess} onClose={() => setShowLogin(false)} />
      </Modal>

      {/* 编辑弹窗 */}
      <Modal visible={showEdit} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowEdit(false)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>编辑个人信息</Text>
            <Text style={styles.fieldLabel}>昵称</Text>
            <TextInput
              style={styles.modalInput}
              value={editNickname}
              onChangeText={setEditNickname}
              placeholder="请输入昵称"
              placeholderTextColor={colors.textDim}
            />
            <Text style={styles.fieldLabel}>个人介绍</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="介绍一下自己"
              placeholderTextColor={colors.textDim}
              multiline
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowEdit(false)}>
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleSaveProfile}>
                <Text style={styles.modalConfirmText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 励志散文弹窗 / 消息通知弹窗 */}
      <Modal visible={showEssay} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowEssay(false)}>
          <View style={styles.essayBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.essayTitle}>{essay ? '✨ 每日励志' : '📭 消息通知'}</Text>
            {essay ? (
              <Text style={styles.essayContent}>{essay}</Text>
            ) : (
              <View style={styles.emptyMsg}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>暂无消息</Text>
              </View>
            )}
            <TouchableOpacity style={styles.essayBtn} onPress={() => setShowEssay(false)}>
              <Text style={styles.essayBtnText}>{essay ? '收下这份鼓励' : '知道了'}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 富文本 WebView */}
      <Modal visible={showWebView !== null} animationType="slide">
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={{ padding: 16, paddingTop: 50, backgroundColor: colors.background, alignItems: 'center' }}
            onPress={() => setShowWebView(null)}>
            <Text style={{ fontSize: fonts.medium, color: colors.primary, fontWeight: '600' }}>
              {showWebView === 'help' ? '帮助与反馈' : '关于我们'} ✕
            </Text>
          </TouchableOpacity>
          <WebView source={{ html: htmlContent }} style={{ flex: 1 }} />
        </View>
      </Modal>

      {/* 隐私协议 WebView */}
      <Modal visible={showPrivacy} animationType="slide">
        <View style={{ flex: 1 }}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity onPress={() => setShowPrivacy(false)}>
              <Text style={styles.webViewBackText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>隐私协议</Text>
            <View style={styles.webViewPlaceholder} />
          </View>
          <WebView source={{ uri: PRIVACY_URL }} style={{ flex: 1 }} />
        </View>
      </Modal>

      {/* 用户协议 WebView */}
      <Modal visible={showUserAgreement} animationType="slide">
        <View style={{ flex: 1 }}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity onPress={() => setShowUserAgreement(false)}>
              <Text style={styles.webViewBackText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>用户服务协议</Text>
            <View style={styles.webViewPlaceholder} />
          </View>
          <WebView source={{ html: getUserAgreementHtml() }} style={{ flex: 1 }} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 30 },
  header: { alignItems: 'center', paddingTop: 50, paddingBottom: 20 },
  headerTitle: { fontSize: fonts.title, fontWeight: '800', color: colors.secondary, letterSpacing: 4 },
  headerSubtitle: { fontSize: fonts.small, color: colors.textDim, letterSpacing: 6, marginTop: 4 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16,
    backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.cardBorder,
    padding: 16, marginBottom: 12,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceLight,
    borderWidth: 2, borderColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarPlaceholder: { borderColor: colors.textDim },
  avatarText: { fontSize: 22, fontWeight: '800', color: colors.primary },
  profileInfo: { marginLeft: 14, flex: 1 },
  username: { fontSize: fonts.large, fontWeight: '700', color: colors.text },
  userDesc: { fontSize: fonts.small, color: colors.textDim, marginTop: 2 },
  editBadge: {
    backgroundColor: colors.surfaceLight, paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 14, borderWidth: 1, borderColor: colors.cardBorder,
  },
  editText: { fontSize: fonts.small, color: colors.primary },
  menuCard: {
    marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuLabel: { fontSize: fonts.medium, color: colors.text },
  menuArrow: { fontSize: 22, color: colors.textDim },
  menuDivider: { height: 1, backgroundColor: colors.cardBorder, marginLeft: 48 },
  logoutBtn: {
    marginHorizontal: 16, marginTop: 20, backgroundColor: colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: colors.cardBorder, paddingVertical: 14, alignItems: 'center',
  },
  logoutText: { fontSize: fonts.medium, color: colors.danger, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: fonts.small, color: colors.textDim, marginTop: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 20, padding: 24, marginHorizontal: 32, width: '80%' },
  modalTitle: { fontSize: fonts.large, fontWeight: '700', color: colors.text, marginBottom: 16, textAlign: 'center' },
  fieldLabel: { fontSize: fonts.small, color: colors.textSecondary, marginBottom: 6, fontWeight: '600' },
  modalInput: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: fonts.regular,
    color: colors.text, marginBottom: 14,
  },
  modalInputMultiline: { height: 80, textAlignVertical: 'top' },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalCancelBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  modalCancelText: { fontSize: fonts.regular, color: colors.textDim },
  modalConfirmBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  modalConfirmText: { fontSize: fonts.regular, color: '#fff', fontWeight: '600' },
  essayBox: { backgroundColor: '#fff', borderRadius: 20, padding: 28, marginHorizontal: 32, alignItems: 'center' },
  essayTitle: { fontSize: fonts.large, fontWeight: '700', color: colors.primary, marginBottom: 16 },
  essayContent: { fontSize: fonts.regular, color: colors.text, lineHeight: 26, textAlign: 'center', marginBottom: 20 },
  essayBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 32, paddingVertical: 12 },
  essayBtnText: { fontSize: fonts.medium, color: '#fff', fontWeight: '600' },
  emptyMsg: { alignItems: 'center', paddingVertical: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: fonts.medium, color: colors.textDim },
  webViewBack: {
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
    backgroundColor: '#ffffff',
  },
  webViewBackText: { fontSize: 28, color: colors.primary, fontWeight: '500' },
  webViewHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  webViewTitle: { fontSize: fonts.medium, color: colors.text, fontWeight: '600' },
  webViewPlaceholder: { width: 30 },
});

export default ProfileScreen;
